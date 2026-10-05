<?php
/**
 * Single · Lugar
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header();
while ( have_posts() ) : the_post();
    $tipos = get_the_terms( get_the_ID(), 'tipo' );
    $tipo  = ( $tipos && ! is_wp_error( $tipos ) ) ? $tipos[0] : null;
    $affs  = get_the_terms( get_the_ID(), 'afinidade' );
    $dica  = ondesair_meta( '_os_dica' );
    $by    = ondesair_meta( '_os_dica_by', 'Curadoria · time Onde Sair' );
?>

<div class="shell">

    <section class="detail-hero">
        <div class="crumbs">
            <a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php bloginfo( 'name' ); ?></a>
            <span class="sep">/</span>
            <a href="<?php echo esc_url( get_post_type_archive_link( 'lugar' ) ); ?>">Lugares</a>
            <?php if ( $tipo ) : ?>
                <span class="sep">/</span>
                <a href="<?php echo esc_url( get_term_link( $tipo ) ); ?>"><?php echo esc_html( $tipo->name ); ?></a>
            <?php endif; ?>
            <?php $bairro = ondesair_meta( '_os_bairro' ); if ( $bairro ) : ?>
                <span class="sep">/</span><span><?php echo esc_html( $bairro ); ?></span>
            <?php endif; ?>
        </div>

        <h1 class="detail-title"><?php the_title(); ?></h1>

        <div class="detail-meta">
            <?php if ( $affs && ! is_wp_error( $affs ) ) : foreach ( $affs as $a ) : ?>
                <a class="chip-type" href="<?php echo esc_url( get_term_link( $a ) ); ?>"><?php echo esc_html( $a->name ); ?></a>
            <?php endforeach; endif; ?>
            <span class="dot"></span>
            <span>★ <?php echo esc_html( ondesair_meta( '_os_rating', '4.7' ) ); ?> · <?php echo esc_html( ondesair_meta( '_os_reviews', '120' ) ); ?> avaliações</span>
            <span class="dot"></span>
            <span><?php echo esc_html( ondesair_price_label() ); ?></span>
            <?php if ( ondesair_is_vip() ) : ?>
                <span class="dot"></span><span class="tag-vip">VIP disponível</span>
            <?php endif; ?>
        </div>

        <div class="detail-cover">
            <?php ondesair_thumb( 'os-cover', $tipo ? $tipo->name : '' ); ?>
        </div>
    </section>

    <section class="detail-grid">
        <div class="detail-body">
            <span class="eyebrow">A leitura do lugar</span>
            <p style="margin:12px 0 24px;font-weight:500;font-size:24px;line-height:1.35;letter-spacing:-0.015em;color:var(--ink);">
                <?php echo wp_kses_post( get_the_excerpt() ); ?>
            </p>

            <?php if ( $dica ) : ?>
            <div class="dica-block">
                <span class="eyebrow">A dica que importa</span>
                <p>"<?php echo esc_html( $dica ); ?>"</p>
                <span class="by">— <?php echo esc_html( $by ); ?></span>
            </div>
            <?php endif; ?>

            <div class="entry-content">
                <?php the_content(); ?>
            </div>
        </div>

        <aside class="detail-side">

            <?php if ( ondesair_is_vip() ) : ?>
            <div class="book-card">
                <span class="tag-vip solid">VIP disponível</span>
                <h4>Mesa reservada<br>+ brinde de cortesia</h4>
                <p>Pague aqui, chegue como convidado. Cuidamos do resto.</p>
                <a class="btn btn-cta" href="<?php echo esc_url( home_url( '/vip/?lugar=' . get_the_ID() ) ); ?>">Quero VIP · R$ 89 →</a>
            </div>
            <?php endif; ?>

            <div class="card" style="padding:24px;">
                <div class="row gap-12" style="margin-bottom:18px;">
                    <button class="btn btn-ghost" style="flex:1;" data-os-save="<?php echo (int) get_the_ID(); ?>">☆ Salvar</button>
                    <button class="btn btn-ghost" style="flex:1;" onclick="if(navigator.share){navigator.share({title:document.title,url:location.href});}else{navigator.clipboard.writeText(location.href);}">Compartilhar</button>
                </div>

                <?php if ( $tipo ) : ?>
                <div class="info-row"><span class="label">Tipo</span><span class="val"><?php echo esc_html( $tipo->name ); ?></span></div>
                <?php endif; ?>
                <?php if ( $bairro ) : ?>
                <div class="info-row"><span class="label">Bairro</span><span class="val"><?php echo esc_html( $bairro ); ?></span></div>
                <?php endif; ?>
                <?php $h = ondesair_meta( '_os_horario' ); if ( $h ) : ?>
                <div class="info-row"><span class="label">Funcionamento</span><span class="val"><?php echo esc_html( $h ); ?></span></div>
                <?php endif; ?>
                <?php $end = ondesair_meta( '_os_endereco' ); if ( $end ) : ?>
                <div class="info-row"><span class="label">Endereço</span><span class="val"><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=<?php echo urlencode( $end ); ?>"><?php echo esc_html( $end ); ?></a></span></div>
                <?php endif; ?>
                <div class="info-row"><span class="label">Faixa de preço</span><span class="val"><?php echo esc_html( ondesair_price_label() ); ?></span></div>
            </div>
        </aside>
    </section>

    <?php
    // Lugares relacionados pelas mesmas afinidades
    if ( $affs && ! is_wp_error( $affs ) ) :
        $related = new WP_Query( [
            'post_type'      => 'lugar',
            'posts_per_page' => 3,
            'post__not_in'   => [ get_the_ID() ],
            'tax_query'      => [ [
                'taxonomy' => 'afinidade',
                'field'    => 'term_id',
                'terms'    => wp_list_pluck( $affs, 'term_id' ),
            ] ],
        ] );
    ?>
        <?php if ( $related->have_posts() ) : ?>
            <section class="section">
                <div class="head">
                    <div>
                        <span class="eyebrow">Mesma vibe</span>
                        <h2>Se você gostou daqui</h2>
                    </div>
                </div>
                <div class="places-grid">
                    <?php while ( $related->have_posts() ) : $related->the_post();
                        $rtipo = get_the_terms( get_the_ID(), 'tipo' );
                        $rtipo_lbl = ( $rtipo && ! is_wp_error( $rtipo ) ) ? $rtipo[0]->name : '';
                    ?>
                        <a class="card place interactive" href="<?php the_permalink(); ?>">
                            <?php ondesair_thumb( 'os-card', $rtipo_lbl ); ?>
                            <div class="body">
                                <?php if ( $rtipo_lbl ) : ?><span class="chip-type"><?php echo esc_html( $rtipo_lbl ); ?></span><?php endif; ?>
                                <h4><?php the_title(); ?></h4>
                                <p class="sub"><?php echo esc_html( ondesair_meta( '_os_bairro' ) ); ?> · <?php echo wp_kses_post( get_the_excerpt() ); ?></p>
                            </div>
                            <div class="footer">
                                <span class="stars">★ <?php echo esc_html( ondesair_meta( '_os_rating', '4.7' ) ); ?></span>
                                <span><?php echo esc_html( ondesair_price_label() ); ?></span>
                            </div>
                        </a>
                    <?php endwhile; wp_reset_postdata(); ?>
                </div>
            </section>
        <?php endif; ?>
    <?php endif; ?>

</div>

<?php endwhile; get_footer();
