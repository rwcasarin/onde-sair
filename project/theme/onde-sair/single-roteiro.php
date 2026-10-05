<?php
/**
 * Single · Roteiro
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header();
while ( have_posts() ) : the_post();
    $affs    = get_the_terms( get_the_ID(), 'afinidade' );
    $aff     = ( $affs && ! is_wp_error( $affs ) ) ? $affs[0] : null;
    $paradas = (int) ondesair_meta( '_os_paradas', 3 );
    $bairros = ondesair_meta( '_os_bairros' );
?>

<div class="shell">

    <section class="detail-hero">
        <div class="crumbs">
            <a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php bloginfo( 'name' ); ?></a>
            <span class="sep">/</span>
            <a href="<?php echo esc_url( get_post_type_archive_link( 'roteiro' ) ); ?>">Roteiros</a>
            <?php if ( $aff ) : ?>
                <span class="sep">/</span>
                <a href="<?php echo esc_url( get_term_link( $aff ) ); ?>"><?php echo esc_html( $aff->name ); ?></a>
            <?php endif; ?>
        </div>

        <h1 class="detail-title"><?php the_title(); ?></h1>

        <div class="detail-meta">
            <?php if ( $aff ) : ?><span class="chip"><?php echo esc_html( $aff->name ); ?></span><?php endif; ?>
            <span class="dot"></span>
            <span><?php echo (int) $paradas; ?> paradas</span>
            <?php if ( $bairros ) : ?>
                <span class="dot"></span><span><?php echo esc_html( $bairros ); ?></span>
            <?php endif; ?>
            <?php if ( ondesair_is_vip() ) : ?>
                <span class="dot"></span><span class="tag-vip">VIP disponível</span>
            <?php endif; ?>
        </div>

        <div class="detail-cover">
            <?php ondesair_thumb( 'os-cover', $aff ? $aff->name : '' ); ?>
        </div>
    </section>

    <section class="detail-grid">
        <div class="detail-body">
            <span class="eyebrow">O roteiro</span>
            <p style="margin:12px 0 24px;font-weight:500;font-size:24px;line-height:1.35;letter-spacing:-0.015em;color:var(--ink);">
                <?php echo wp_kses_post( get_the_excerpt() ); ?>
            </p>
            <div class="entry-content">
                <?php the_content(); ?>
            </div>
        </div>

        <aside class="detail-side">
            <div class="card" style="padding:24px;">
                <span class="eyebrow">Quer fechar tudo?</span>
                <h4 style="font-weight:700;font-size:22px;letter-spacing:-0.015em;margin:10px 0 14px;line-height:1.2;">
                    Reserve o roteiro inteiro com 1 clique.
                </h4>
                <p class="small" style="margin-bottom:18px;">A gente coordena horários e reservas com os parceiros — você só aparece.</p>
                <a class="btn btn-cta" style="width:100%;" href="<?php echo esc_url( home_url( '/vip/?roteiro=' . get_the_ID() ) ); ?>">Reservar tudo →</a>
            </div>
        </aside>
    </section>

</div>

<?php endwhile; get_footer();
